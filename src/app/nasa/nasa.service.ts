import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class NasaService {
  private apiKey = 'DEMO_KEY'; // Replace with your actual NASA API key
  private baseUrl = 'https://api.nasa.gov';

  constructor(private http: HttpClient) {}

  getApod(): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/planetary/apod?api_key=${this.apiKey}`
    );
  }

  getMarsRoverPhotos(
    sol: number = 1000,
    rover: string = 'curiosity'
  ): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&api_key=${this.apiKey}`
    );
  }

  getAsteroids(startDate: string, endDate: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${this.apiKey}`
    );
  }

  getEarthImagery(lat: number, lon: number, date: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/planetary/earth/imagery?lon=${lon}&lat=${lat}&date=${date}&dim=0.1&api_key=${this.apiKey}`
    );
  }

  searchNasaImages(query: string): Observable<any> {
    return this.http.get(`https://images-api.nasa.gov/search?q=${query}`);
  }

  // nasa.service.ts
  getCME(startDate: string, endDate: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${this.apiKey}`
    );
  }
  getSolarFlares(startDate: string, endDate: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/DONKI/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${this.apiKey}`
    );
  }

  getAssetByNasaId(nasaId: string): Observable<any> {
    return this.http.get(`https://images-api.nasa.gov/asset/${nasaId}`);
  }
}
