import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FileDropComponent } from '../../components/file-drop/file-drop.component';
import { ProfileListComponent } from '../../components/profile-list/profile-list.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { ComparisonResult, ProfileHandle } from '../../model/profile.model';
import { ConnectionsService } from '../../service/connections.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FileDropComponent, StatCardComponent, ProfileListComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css'
})
export class DashboardPage {
  protected readonly archiveFileName = signal<string | null>(null);
  protected readonly followers = signal<ProfileHandle[]>([]);
  protected readonly following = signal<ProfileHandle[]>([]);
  protected readonly comparison = signal<ComparisonResult | null>(null);
  protected readonly lastError = signal<string | null>(null);
  protected readonly loading = signal<'archive' | null>(null);

  constructor(private readonly connections: ConnectionsService) {}

  handleArchiveFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      this.lastError.set('El archivo comprimido debe ser .zip.');
      return;
    }

    this.lastError.set(null);
    this.loading.set('archive');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result;
        if (!(result instanceof ArrayBuffer)) {
          throw new Error('No se pudo leer el archivo ZIP.');
        }

        const { followers, following } = await this.connections.extractProfilesFromArchive(result);
        this.followers.set(followers);
        this.following.set(following);
        this.archiveFileName.set(file.name);
        this.refreshComparison();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo procesar el archivo ZIP.';
        this.lastError.set(message);
        this.comparison.set(null);
      } finally {
        this.loading.set(null);
      }
    };

    reader.onerror = () => {
      this.lastError.set('Hubo un problema al leer el archivo ZIP.');
      this.loading.set(null);
    };

    reader.readAsArrayBuffer(file);
  }

  protected get readyForComparison(): boolean {
    return Boolean(this.followers().length && this.following().length);
  }

  private refreshComparison(): void {
    if (!this.readyForComparison) {
      this.comparison.set(null);
      return;
    }

    this.comparison.set(this.connections.compareProfiles(this.followers(), this.following()));
  }
}
