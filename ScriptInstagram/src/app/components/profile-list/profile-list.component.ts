import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ProfileHandle } from '../../model/profile.model';

@Component({
  selector: 'app-profile-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-list.component.html',
  styleUrl: './profile-list.component.css'
})
export class ProfileListComponent implements OnChanges {
  @Input() title = '';
  @Input() caption = '';
  @Input() profiles: ProfileHandle[] = [];
  @Input() emptyMessage = 'Sin perfiles para mostrar.';
  @Input() accent: 'rose' | 'salmon' | 'neutral' = 'neutral';
  @Input() pageSize = 12;

  protected currentPage = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profiles'] || changes['pageSize']) {
      this.currentPage = 1;
    }

    this.enforceBounds();
  }

  protected get paginatedProfiles(): ProfileHandle[] {
    const effectivePageSize = Math.max(1, this.pageSize);
    const start = (this.currentPage - 1) * effectivePageSize;
    return this.profiles.slice(start, start + effectivePageSize);
  }

  protected get totalPages(): number {
    const effectivePageSize = Math.max(1, this.pageSize);
    return this.profiles.length ? Math.ceil(this.profiles.length / effectivePageSize) : 1;
  }

  protected get hasMultiplePages(): boolean {
    return this.profiles.length > Math.max(1, this.pageSize);
  }

  protected goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(1, page), this.totalPages);
  }

  protected nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  protected prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  private enforceBounds(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  protected formatTimestamp(timestamp?: number): string | null {
    if (!timestamp) {
      return null;
    }

    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
