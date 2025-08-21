import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MigrationService, MigrationResult } from '../../services/migration.service';
import { GameState } from '../../models/candy-factory.interface';

@Component({
  selector: 'app-migration-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="migration-overlay" *ngIf="showDialog">
      <div class="migration-dialog" (click)="$event.stopPropagation()">
        <div class="migration-header">
          <h2>🔄 Migrate Your Save Data</h2>
          <p>We found existing game data on your device. Would you like to sync it with your account?</p>
        </div>

        <div class="migration-content">
          <div class="local-save-preview" *ngIf="localSaveData">
            <h3>📱 Local Save Data Preview:</h3>
            <div class="save-stats">
              <div class="stat">
                <span class="label">Candy:</span>
                <span class="value">{{formatNumber(localSaveData.candy)}}</span>
              </div>
              <div class="stat">
                <span class="label">Total Earned:</span>
                <span class="value">{{formatNumber(localSaveData.totalCandyEarned)}}</span>
              </div>
              <div class="stat">
                <span class="label">Prestige Level:</span>
                <span class="value">{{localSaveData.prestigeLevel || 0}}</span>
              </div>
              <div class="stat">
                <span class="label">Achievements:</span>
                <span class="value">{{(localSaveData.unlockedAchievements && localSaveData.unlockedAchievements.length) || 0}}</span>
              </div>
            </div>
          </div>

          <div class="migration-options">
            <div class="option-info">
              <p><strong>✅ Recommended:</strong> Migrate your local progress to your account for cross-device play.</p>
              <p><strong>📱 Local data will be preserved</strong> as backup even after migration.</p>
            </div>
          </div>

          <div class="migration-result" *ngIf="migrationResult">
            <div class="result-message" 
                 [class.success]="migrationResult.success"
                 [class.error]="!migrationResult.success">
              <span class="result-icon">{{migrationResult.success ? '✅' : '❌'}}</span>
              {{migrationResult.message}}
            </div>
          </div>
        </div>

        <div class="migration-actions">
          <button 
            class="migrate-btn primary"
            [disabled]="isProcessing"
            (click)="startMigration()">
            <span *ngIf="!isProcessing">🔄 Migrate Data</span>
            <span *ngIf="isProcessing">⏳ Migrating...</span>
          </button>
          
          <button 
            class="skip-btn secondary"
            [disabled]="isProcessing"
            (click)="skipMigration()">
            Skip for Now
          </button>
          
          <button 
            class="close-btn"
            *ngIf="migrationResult?.success"
            (click)="closeMigration()">
            Continue Playing
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .migration-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    }

    .migration-dialog {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #4a90e2;
      border-radius: 15px;
      padding: 30px;
      max-width: 500px;
      width: 90vw;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.3s ease-out;
    }

    .migration-header {
      text-align: center;
      margin-bottom: 25px;
    }

    .migration-header h2 {
      color: #4a90e2;
      font-size: 1.8em;
      margin: 0 0 10px 0;
    }

    .migration-header p {
      color: #b0b0b0;
      margin: 0;
      line-height: 1.4;
    }

    .local-save-preview {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .local-save-preview h3 {
      color: #4a90e2;
      margin: 0 0 15px 0;
      font-size: 1.2em;
    }

    .save-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .stat .label {
      color: #b0b0b0;
      font-size: 0.9em;
    }

    .stat .value {
      color: #ffffff;
      font-weight: bold;
    }

    .migration-options {
      margin-bottom: 20px;
    }

    .option-info p {
      color: #b0b0b0;
      margin: 8px 0;
      font-size: 0.95em;
      line-height: 1.4;
    }

    .migration-result {
      margin: 20px 0;
    }

    .result-message {
      padding: 15px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .result-message.success {
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid #4caf50;
      color: #4caf50;
    }

    .result-message.error {
      background: rgba(244, 67, 54, 0.2);
      border: 1px solid #f44336;
      color: #f44336;
    }

    .migration-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }

    button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 1em;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 120px;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .primary {
      background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
      color: white;
    }

    .primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #357abd 0%, #2968a3 100%);
      transform: translateY(-2px);
    }

    .secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #b0b0b0;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    .close-btn {
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
      color: white;
    }

    .close-btn:hover {
      background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 600px) {
      .migration-dialog {
        padding: 20px;
      }
      
      .save-stats {
        grid-template-columns: 1fr;
      }
      
      .migration-actions {
        flex-direction: column;
      }
    }
  `]
})
export class MigrationDialogComponent {
  @Input() showDialog = false;
  @Output() closeDialogEvent = new EventEmitter<void>();
  @Output() migrationCompleteEvent = new EventEmitter<MigrationResult>();

  localSaveData: GameState | null = null;
  isProcessing = false;
  migrationResult: MigrationResult | null = null;

  constructor(private migrationService: MigrationService) {}

  ngOnInit(): void {
    if (this.showDialog) {
      this.localSaveData = this.migrationService.getLocalSaveData();
    }
  }

  async startMigration(): Promise<void> {
    this.isProcessing = true;
    this.migrationResult = null;

    try {
      const result = await this.migrationService.migrateLocalSaveToServer();
      this.migrationResult = result;
      
      if (result.success) {
        // Emit migration complete event after a brief delay
        setTimeout(() => {
          this.migrationCompleteEvent.emit(result);
        }, 1500);
      }
    } catch (error) {
      this.migrationResult = {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated: false,
        hadLocalData: true
      };
    } finally {
      this.isProcessing = false;
    }
  }

  skipMigration(): void {
    // Mark migration as skipped for this session
    this.migrationService.markMigrationCompleted();
    this.closeDialogEvent.emit();
  }

  closeMigration(): void {
    this.closeDialogEvent.emit();
  }

  formatNumber(num: number): string {
    if (isNaN(num) || !isFinite(num)) return '0';
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    return (num / 1000000000000).toFixed(1) + 'T';
  }
}