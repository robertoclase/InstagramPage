import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ProfileHandle } from '../../model/profile.model';

@Component({
  selector: 'app-profile-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-list.component.html',
  styleUrl: './profile-list.component.css'
})
export class ProfileListComponent {
  @Input() title = '';
  @Input() caption = '';
  @Input() profiles: ProfileHandle[] = [];
  @Input() emptyMessage = 'Sin perfiles para mostrar.';
  @Input() accent: 'rose' | 'salmon' | 'neutral' = 'neutral';

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
