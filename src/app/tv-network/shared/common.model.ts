// src/app/shared/models/common.model.ts

export interface Tag {
    id?: string;
    name: string;
    type: 'show' | 'episode' | 'media'; // determines usage level
    createdAt?: string; // ISO date string
    description?: string; // optional description for the tag
    showOnHome?: boolean; // whether to show this tag on the home page

  }
  
  export interface Show {
    id?: string;
    title: string;
    description: string;
    genre: string[];
    coverImage: string;
    bannerImage: string;
    tags?: string[]; // array of tag IDs
    seasonCount?: number;
    totalEpisodes?: number;
  }
  
  export interface Season {
    id?: string;
    seasonNumber: number;
    description?: string;
    episodesCount?: number;
  }
  
  export interface Episode {
    id?: string;
    title: string;
    description: string;
    duration: number;
    videoUrl: string;
    thumbnailUrl: string;
    publishDate: string;
    episodeNumber: number;
    tags?: string[]; // tag IDs
  }
  
  export interface Media {
    id?: string;
    type: 'trailer' | 'poster' | 'teaser';
    url: string;
    thumbnail: string;
    uploadedAt: string;
    tags?: string[];
  }