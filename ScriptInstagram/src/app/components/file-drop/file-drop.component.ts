import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';

@Component({
  selector: 'app-file-drop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-drop.component.html',
  styleUrl: './file-drop.component.css'
})
export class FileDropComponent {
  @Input() label = 'Archivo JSON';
  @Input() description = 'Arrastra y suelta o haz clic para seleccionar un archivo.';
  @Input() accept = '.json';
  @Input() fileName: string | null = null;
  @Output() filePicked = new EventEmitter<File>();

  protected readonly isOver = signal(false);

  @ViewChild('fileInput') private readonly fileInput?: ElementRef<HTMLInputElement>;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.filePicked.emit(file);
      this.resetNativeInput();
    }
  }

  openFileExplorer(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (file) {
      this.filePicked.emit(file);
    }
    this.resetNativeInput();
  }

  private resetNativeInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
