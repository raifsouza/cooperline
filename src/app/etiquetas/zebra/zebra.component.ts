import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router'; // Importe RouterLink
import { CommonModule } from '@angular/common'; // Importe CommonModule para *ngIf
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs'; // Para gerenciar a inscrição ao observable
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { SidenavComponent } from '../../shared/sidenav/sidenav.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LabelaryService } from '../../services/labelary.service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-zebra',
  imports: [CommonModule,FormsModule, NavbarComponent, SidenavComponent ],
  templateUrl: './zebra.component.html',
  styleUrl: './zebra.component.scss'
})
export class ZebraComponent implements OnInit, OnDestroy {
  zplContent: string = '^XA^FO50,50^A0N36,36^FDHello, Labelary!^FS^XZ'; // Default ZPL
  dpmm: number = 8;    // Dots per millimeter (e.g., 8 for 203 dpi, 12 for 300 dpi)
  width: number = 4;   // Width in inches
  height: number = 2;  // Height in inches
  renderedLabelUrl: SafeUrl | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isSidenavVisible: boolean = false;

  private objectUrl: string | null = null;

  constructor(
    private labelaryService: LabelaryService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.renderLabel(); // Render default label on init
  }

  ngOnDestroy(): void {
    // Clean up the object URL when the component is destroyed
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result) {
          this.zplContent = reader.result.toString();
          this.renderLabel();
        }
      };
      reader.readAsText(file);
    }
  }

  renderLabel(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.renderedLabelUrl = null;

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl); // Clean up previous URL
      this.objectUrl = null;
    }

    this.labelaryService.renderLabel(this.zplContent, this.dpmm, this.width, this.height)
      .subscribe({
        next: (blob: Blob) => {
          this.objectUrl = URL.createObjectURL(blob);
          this.renderedLabelUrl = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error rendering label:', error);
          this.errorMessage = 'Failed to render label. Please check ZPL content and parameters.';
          this.isLoading = false;
          // You might want to try to read the error body if Labelary returns a text error
          if (error.error instanceof Blob) {
              const reader = new FileReader();
              reader.onload = () => {
                  this.errorMessage = reader.result?.toString() || this.errorMessage;
              };
              reader.readAsText(error.error);
          }
        }
      });
  }

  downloadLabel(): void {
    if (this.renderedLabelUrl && this.objectUrl) {
      const a = document.createElement('a');
      a.href = this.objectUrl;
      a.download = 'label.png'; // You can make this dynamic
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert('No label rendered to download.');
    }
  }

  printLabel(): void {
    if (this.renderedLabelUrl) {
      // For basic printing, you can create a new window/tab with just the image
      // or directly use window.print() if the image is clearly visible.
      const printWindow = window.open('', '_blank', 'width=600,height=400');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Label</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; max-height: 100%; }
              </style>
            </head>
            <body>
              <img src="${this.objectUrl}" onload="window.print();window.close()" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      // Alternatively, for printing the current view:
      // window.print();
    } else {
      alert('No label rendered to print.');
    }
  }

    handleToggleSidenavRequest(): void {
    this.isSidenavVisible = !this.isSidenavVisible;
    console.log('DashboardComponent: Sidenav visibility:', this.isSidenavVisible);
  }

  
  handleCloseSidenavRequest(): void {
    this.isSidenavVisible = false;
    console.log('DashboardComponent: Sidenav close requested.');
  }
}