import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseService } from 'src/app/tv-network/shared/firebase.service';

@Component({
  selector: 'app-upload-content',
  templateUrl: './upload-content.component.html',
  styleUrls: ['./upload-content.component.scss'],
})
export class UploadContentComponent {
  stepForm: FormGroup;
  selectedFiles: File[] = [];
  isUploading = false;
  uploadMessage = '';
  manualMediaUrl = '';
  dragging = false;
  jsonInput: string = '';
  tagOptions = [
    'hero-slide',
    'featured',
    'trending',
    'live',
    'recommended',
    'sports',
  ];

  filesWithTags: {
    file?: File;
    tag: string;
    uploadProgress?: number;
  }[] = [];

  UrlWithTags: {
    tag: string;
    previewUrl: string;
    uploadProgress?: number;
  }[] = [];

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {
    this.stepForm = this.fb.group({
      showDetails: this.fb.group({
        title: ['', Validators.required],
        description: [''],
        category: [''],
        tags: [''],
      }),
      seasons: this.fb.array([]),
      media: this.fb.group({}),
    });
  }

  /** SEASONS & EPISODES FORM SETUP **/

  get seasonsFormArray(): FormArray {
    return this.stepForm.get('seasons') as FormArray;
  }

  createSeason(): FormGroup {
    return this.fb.group({
      seasonTitle: [`Season ${this.seasonsFormArray?.length + 1 || 1}`],
      episodes: this.fb.array([this.createEpisode()]),
    });
  }

  createEpisode(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      tags: [''],
      duration: [''],
      isHeroSlide: [false],
      isFeatured: [false],
      isTrending: [false],
      seasonNumber: [1],
      episodeNumber: [1],
      publishDate: [new Date()],
    });
  }

  getEpisodesFormArray(seasonIndex: number): FormArray {
    return this.seasonsFormArray.at(seasonIndex).get('episodes') as FormArray;
  }

  addSeason(): void {
    this.seasonsFormArray.push(this.createSeason());
  }

  addEpisode(seasonIndex: number): void {
    this.getEpisodesFormArray(seasonIndex).push(this.createEpisode());
  }

  removeEpisode(seasonIndex: number, episodeIndex: number): void {
    this.getEpisodesFormArray(seasonIndex).removeAt(episodeIndex);
  }

  /** FILE UPLOAD SECTION **/

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging = true;
  }

  handleDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragging = false;
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processSelectedFiles(Array.from(files));
    }
  }

  onMediaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.processSelectedFiles(files);
  }

  processSelectedFiles(files: File[]) {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        this.filesWithTags.push({
          file,
          tag: '',
          uploadProgress: 0,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeMedia(i: number) {
    this.filesWithTags.splice(i, 1);
  }

  addMediaUrl() {
    if (this.manualMediaUrl) {
      this.UrlWithTags.push({
        previewUrl: this.manualMediaUrl,
        tag: '',
      });
      this.manualMediaUrl = '';
    }
  }

  removeMediaUrl(i: number) {
    this.UrlWithTags.splice(i, 1);
  }

  /** FORM SUBMISSION **/

  async submit() {
    this.uploadMessage = '';
    if (
      this.stepForm.invalid ||
      (this.filesWithTags.length === 0 && this.UrlWithTags.length === 0)
    ) {
      this.uploadMessage = 'Please complete all steps and upload media.';
      return;
    }

    this.isUploading = true;
    this.uploadMessage = 'Uploading...';

    try {
      const showData = this.stepForm.get('showDetails')?.value;

      // Add show document
      const showId = await this.firebaseService.addDocToCollection(
        'shows',
        showData
      );

      // Iterate through seasons
      for (
        let seasonIndex = 0;
        seasonIndex < this.seasonsFormArray.length;
        seasonIndex++
      ) {
        const seasonGroup = this.seasonsFormArray.at(seasonIndex) as FormGroup;
        const seasonTitle =
          seasonGroup.get('seasonTitle')?.value || `Season ${seasonIndex + 1}`;
        const episodes = (seasonGroup.get('episodes') as FormArray).value;

        const seasonDoc = {
          seasonNumber: seasonIndex + 1,
          title: seasonTitle,
          description: `Auto-created for ${seasonTitle}`,
          episodesCount: episodes.length,
        };

        const seasonId = await this.firebaseService.addDocToCollection(
          `shows/${showId}/seasons`,
          seasonDoc
        );

        for (let epIndex = 0; epIndex < episodes.length; epIndex++) {
          const episode = {
            ...episodes[epIndex],
            seasonNumber: seasonIndex + 1,
            episodeNumber: epIndex + 1,
            publishDate: episodes[epIndex].publishDate || new Date(),
          };
          await this.firebaseService.addDocToCollection(
            `shows/${showId}/seasons/${seasonId}/episodes`,
            episode
          );
        }
      }

      // Upload files to Cloudinary
      const files = this.filesWithTags
        .map((item) => item.file)
        .filter(Boolean) as File[];
      if (files.length > 0) {
        const uploadedResults =
          await this.firebaseService.uploadMultipleToCloudinary(files);

        for (let index = 0; index < uploadedResults.length; index++) {
          const res = uploadedResults[index];
          const tag = this.filesWithTags[index]?.tag || 'untagged';

          const mediaDoc = {
            ...res,
            type: this.getUrlType(res.url),
            tag,
            uploadedAt: new Date(),
          };

          await this.firebaseService.addDocToCollection(
            `shows/${showId}/media`,
            mediaDoc
          );
        }
      }

      // Handle manual URLs
      for (let index = 0; index < this.UrlWithTags.length; index++) {
        const { previewUrl: url, tag } = this.UrlWithTags[index];
        const mediaDoc = {
          url,
          type: this.getUrlType(url),
          tag: tag || 'untagged',
          uploadedAt: new Date(),
        };

        await this.firebaseService.addDocToCollection(
          `shows/${showId}/media`,
          mediaDoc
        );
      }

      this.uploadMessage = 'Upload successful!';
      this.stepForm.reset();
      this.filesWithTags = [];
      this.UrlWithTags = [];
      this.seasonsFormArray.clear();
      this.addSeason();
    } catch (error) {
      console.error('Upload failed:', error);
      this.uploadMessage = 'Upload failed.';
    } finally {
      this.isUploading = false;
    }
  }

  getUrlType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    if (!extension) return 'unknown';

    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoTypes = ['mp4', 'mov', 'webm', 'avi'];

    if (imageTypes.includes(extension)) return 'image';
    if (videoTypes.includes(extension)) return 'video';

    return 'unknown';
  }

  async handleJsonUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);

        const { title, description, type, tags, seasons, media } = json;

        const showData = { title, description, type, tags };
        const showId = await this.firebaseService.addDocToCollection(
          'shows',
          showData
        );

        // Add Seasons & Episodes
        for (const season of seasons || []) {
          const { title: seasonTitle, seasonNumber, episodes } = season;
          const seasonDoc = {
            title: seasonTitle,
            seasonNumber,
            description: `Auto-imported`,
            episodesCount: episodes?.length || 0,
          };
          const seasonId = await this.firebaseService.addDocToCollection(
            `shows/${showId}/seasons`,
            seasonDoc
          );

          for (const [index, ep] of (episodes || []).entries()) {
            const episode = {
              ...ep,
              seasonNumber,
              episodeNumber: index + 1,
              publishDate: new Date(ep.publishDate || new Date()),
            };
            await this.firebaseService.addDocToCollection(
              `shows/${showId}/seasons/${seasonId}/episodes`,
              episode
            );
          }
        }

        // Add media (if any)
        for (const mediaItem of media || []) {
          const mediaDoc = {
            ...mediaItem,
            uploadedAt: new Date(),
            type: this.getUrlType(mediaItem.url),
          };
          await this.firebaseService.addDocToCollection(
            `shows/${showId}/media`,
            mediaDoc
          );
        }

        this.uploadMessage = 'Bulk upload via JSON successful!';
      } catch (err) {
        console.error('Invalid JSON:', err);
        this.uploadMessage = 'Invalid JSON format or upload error.';
      }
    };

    reader.readAsText(file);
  }

  async submitPastedJson() {
    console.log(this.jsonInput);
  
    try {
      const parsed = JSON.parse(this.jsonInput);
  
      if (!Array.isArray(parsed)) {
        this.uploadMessage = 'Please paste a JSON array of shows.';
        return;
      }
  
      for (const val of parsed) {
        if (!val || typeof val !== 'object') {
          console.warn('Skipping invalid show entry:', val);
          continue;
        }
  
        const { title, description, type, tags, seasons, media } = val;
  
        const showData = { title, description, type, tags };
        const showId = await this.firebaseService.addDocToCollection('shows', showData);
  
        for (const season of seasons || []) {
          const { title: seasonTitle, seasonNumber, episodes } = season;
          const seasonDoc = {
            title: seasonTitle,
            seasonNumber,
            description: `Auto-imported`,
            episodesCount: episodes?.length || 0,
          };
          const seasonId = await this.firebaseService.addDocToCollection(
            `shows/${showId}/seasons`,
            seasonDoc
          );
  
          for (const [index, ep] of (episodes || []).entries()) {
            const episode = {
              ...ep,
              seasonNumber,
              episodeNumber: index + 1,
              publishDate: new Date(ep.publishDate || new Date()),
            };
            await this.firebaseService.addDocToCollection(
              `shows/${showId}/seasons/${seasonId}/episodes`,
              episode
            );
          }
        }
  
        for (const mediaItem of media || []) {
          const mediaDoc = {
            ...mediaItem,
            uploadedAt: new Date(),
            type: this.getUrlType(mediaItem.url),
          };
          await this.firebaseService.addDocToCollection(
            `shows/${showId}/media`,
            mediaDoc
          );
        }
      }
  
      this.uploadMessage = 'Bulk upload via pasted JSON successful!';
      this.jsonInput = '';
    } catch (err) {
      console.error('Invalid JSON:', err);
      this.uploadMessage = 'Invalid JSON format.';
    }
  }
}
