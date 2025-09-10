import { Component } from '@angular/core';
import { AdminService } from './admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Tag } from '../../shared/common.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  tagForm!: FormGroup;
  jsonInput = '';
  tags: Tag[] = [];

  constructor(private fb: FormBuilder, private adminService: AdminService) {}

  ngOnInit(): void {
    this.tagForm = this.fb.group({
      name: ['', Validators.required],
      type: ['show', Validators.required],
      description: ['']
    });

    this.loadTags();
  }

  async loadTags() {
    this.tags = await this.adminService.getTags();
  }

  async addTag() {
    const newTag = this.tagForm.value as Tag;
    await this.adminService.addTag(newTag);
    this.tagForm.reset({ type: 'show' });
    this.loadTags();
  }

  async uploadTagsFromJson() {
    try {
      const tags = JSON.parse(this.jsonInput) as Tag[];
      if (Array.isArray(tags)) {
        await this.adminService.addMultipleTags(tags);
        this.jsonInput = '';
        this.loadTags();
      }
    } catch (err) {
      alert('Invalid JSON format');
    }
  }
}
