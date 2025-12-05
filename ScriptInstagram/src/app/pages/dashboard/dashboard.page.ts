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
  protected readonly followersFileName = signal<string | null>(null);
  protected readonly followingFileName = signal<string | null>(null);
  protected readonly followers = signal<ProfileHandle[]>([]);
  protected readonly following = signal<ProfileHandle[]>([]);
  protected readonly comparison = signal<ComparisonResult | null>(null);
  protected readonly lastError = signal<string | null>(null);
  protected readonly loading = signal<'followers' | 'following' | null>(null);

  constructor(private readonly connections: ConnectionsService) {}

  handleFollowersFile(file: File): void {
    this.ingestFile(file, 'followers');
  }

  handleFollowingFile(file: File): void {
    this.ingestFile(file, 'following');
  }

  protected get readyForComparison(): boolean {
    return Boolean(this.followers().length && this.following().length);
  }

  private ingestFile(file: File, kind: 'followers' | 'following'): void {
    this.lastError.set(null);
    this.loading.set(kind);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = (reader.result as string) ?? '';
        const payload =
          kind === 'followers'
            ? this.connections.parseFollowersJson(text)
            : this.connections.parseFollowingJson(text);

        if (kind === 'followers') {
          this.followers.set(payload);
          this.followersFileName.set(file.name);
        } else {
          this.following.set(payload);
          this.followingFileName.set(file.name);
        }

        this.refreshComparison();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo procesar el archivo.';
        this.lastError.set(message);
        this.comparison.set(null);
      } finally {
        this.loading.set(null);
      }
    };

    reader.onerror = () => {
      this.lastError.set('Hubo un problema al leer el archivo.');
      this.loading.set(null);
    };

    reader.readAsText(file);
  }

  private refreshComparison(): void {
    if (!this.readyForComparison) {
      this.comparison.set(null);
      return;
    }

    this.comparison.set(this.connections.compareProfiles(this.followers(), this.following()));
  }
}
