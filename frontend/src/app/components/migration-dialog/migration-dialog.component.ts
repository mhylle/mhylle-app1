import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MigrationService, MigrationResult, DataComparisonResult } from '../../services/migration.service';
import { GameState } from '../../models/candy-factory.interface';

@Component({
  selector: 'app-migration-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="migration-overlay" *ngIf="showDialog">
      <div class="migration-dialog" (click)="$event.stopPropagation()">
        
        <!-- Step 1: Loading data comparison -->
        <div *ngIf="isLoadingComparison" class="migration-header">
          <h2>🔄 Checking Your Save Data</h2>
          <p>⏳ Comparing local and server data...</p>
        </div>

        <!-- Step 2: Show data comparison and choice -->
        <div *ngIf="dataComparison && !migrationResult && !isProcessing" class="migration-content">
          <div class="migration-header">
            <h2>🎮 Choose Your Save Data</h2>
            <p>We found save data both on your device and server. Which would you like to use?</p>
          </div>

          <div class="data-comparison">
            <!-- Local Data Option -->
            <div class="data-option" [class.recommended]="dataComparison.recommendLocal">
              <div class="option-header">
                <h3>📱 Local Device Data</h3>
                <span *ngIf="dataComparison.recommendLocal" class="recommendation">✨ Recommended</span>
              </div>
              <div class="save-stats">
                <div class="stat">
                  <span class="label">Candy:</span>
                  <span class="value">{{formatNumber(dataComparison.localData?.candy || 0)}}</span>
                </div>
                <div class="stat">
                  <span class="label">Total Earned:</span>
                  <span class="value">{{formatNumber(dataComparison.localData?.totalCandyEarned || 0)}}</span>
                </div>
                <div class="stat">
                  <span class="label">Prestige Level:</span>
                  <span class="value">{{dataComparison.localData?.prestigeLevel || 0}}</span>
                </div>
                <div class="stat">
                  <span class="label">Achievements:</span>
                  <span class="value">{{(dataComparison.localData?.unlockedAchievements?.length) || 0}}</span>
                </div>
              </div>
              <p class="option-description">
                <strong>Choose this to:</strong> Upload your local progress and overwrite server data
              </p>
            </div>

            <!-- Server Data Option -->
            <div class="data-option" [class.recommended]="!dataComparison.recommendLocal && dataComparison.hasServerData">
              <div class="option-header">
                <h3>☁️ Server Data</h3>
                <span *ngIf="!dataComparison.recommendLocal && dataComparison.hasServerData" class="recommendation">✨ Recommended</span>
              </div>
              <div class="save-stats" *ngIf="dataComparison.serverData">
                <div class="stat">
                  <span class="label">Candy:</span>
                  <span class="value">{{formatNumber(dataComparison.serverData.candy || 0)}}</span>
                </div>
                <div class="stat">
                  <span class="label">Total Earned:</span>
                  <span class="value">{{formatNumber(dataComparison.serverData.totalCandyEarned || 0)}}</span>
                </div>
                <div class="stat">
                  <span class="label">Prestige Level:</span>
                  <span class="value">{{dataComparison.serverData.prestigeLevel || 0}}</span>
                </div>
                <div class="stat">
                  <span class="label">Achievements:</span>
                  <span class="value">{{(dataComparison.serverData.unlockedAchievements?.length) || 0}}</span>
                </div>
              </div>
              <div *ngIf="!dataComparison.hasServerData" class="no-server-data">
                <p>No server data found</p>
              </div>
              <p class="option-description" *ngIf="dataComparison.hasServerData">
                <strong>Choose this to:</strong> Use your server progress and keep local data as backup
              </p>
            </div>
          </div>

          <div class="choice-actions">
            <button 
              class="choice-btn local-choice"
              [disabled]="!dataComparison.localData"
              (click)="chooseLocalData()">
              📱 Use Local Data
            </button>
            
            <button 
              class="choice-btn server-choice"
              [disabled]="!dataComparison.hasServerData"
              (click)="chooseServerData()">
              ☁️ Use Server Data
            </button>
            
            <button 
              class="skip-btn secondary"
              (click)="skipMigration()">
              Skip for Now
            </button>
          </div>
        </div>

        <!-- Step 3: Processing migration -->
        <div *ngIf="isProcessing" class="migration-header">
          <h2>⏳ Processing Your Choice</h2>
          <p>{{processingMessage}}</p>
        </div>

        <!-- Step 4: Show migration result -->
        <div *ngIf="migrationResult" class="migration-result-content">
          <div class="migration-header">
            <h2>{{migrationResult.success ? '✅ Migration Complete' : '❌ Migration Failed'}}</h2>
          </div>
          
          <div class="result-message" 
               [class.success]="migrationResult.success"
               [class.error]="!migrationResult.success">
            <span class="result-icon">{{migrationResult.success ? '✅' : '❌'}}</span>
            {{migrationResult.message}}
          </div>

          <div class="final-actions">
            <button 
              class="close-btn primary"
              (click)="closeMigration()">
              Continue Playing
            </button>
          </div>
        </div>

        <!-- Error loading comparison -->
        <div *ngIf="loadingError" class="migration-header">
          <h2>❌ Error Loading Data</h2>
          <p>{{loadingError}}</p>
          <button class="close-btn secondary" (click)="skipMigration()">
            Continue Without Migration
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
      max-width: 700px;
      width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
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

    .data-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }

    .data-option {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s ease;
    }

    .data-option.recommended {
      border-color: #4a90e2;
      background: rgba(74, 144, 226, 0.1);
    }

    .option-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .option-header h3 {
      color: #ffffff;
      margin: 0;
      font-size: 1.2em;
    }

    .recommendation {
      background: linear-gradient(135deg, #4a90e2, #357abd);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8em;
      font-weight: bold;
    }

    .save-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
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

    .option-description {
      color: #b0b0b0;
      font-size: 0.9em;
      line-height: 1.4;
      margin: 0;
    }

    .no-server-data {
      text-align: center;
      color: #888;
      padding: 20px;
      font-style: italic;
    }

    .choice-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .final-actions {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }

    button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 1em;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 140px;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .choice-btn {
      background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
      color: white;
      border: 2px solid transparent;
    }

    .choice-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #357abd 0%, #2968a3 100%);
      transform: translateY(-2px);
    }

    .local-choice {
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
    }

    .local-choice:hover:not(:disabled) {
      background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
    }

    .server-choice {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    }

    .server-choice:hover:not(:disabled) {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
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

    .result-message {
      padding: 15px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
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

    @media (max-width: 800px) {
      .data-comparison {
        grid-template-columns: 1fr;
      }
      
      .save-stats {
        grid-template-columns: 1fr;
      }
      
      .choice-actions {
        flex-direction: column;
      }
      
      .migration-dialog {
        padding: 20px;
      }
    }
  `]
})
export class MigrationDialogComponent {
  @Input() showDialog = false;
  @Output() closeDialogEvent = new EventEmitter<void>();
  @Output() migrationCompleteEvent = new EventEmitter<MigrationResult>();

  // Component state
  isLoadingComparison = false;
  isProcessing = false;
  loadingError: string | null = null;
  processingMessage = '';
  
  // Data
  dataComparison: DataComparisonResult | null = null;
  migrationResult: MigrationResult | null = null;

  constructor(private migrationService: MigrationService) {}

  async ngOnInit(): Promise<void> {
    if (this.showDialog) {
      await this.loadDataComparison();
    }
  }

  private async loadDataComparison(): Promise<void> {
    this.isLoadingComparison = true;
    this.loadingError = null;

    try {
      this.dataComparison = await this.migrationService.getDataComparison();
      
      // If no local data, skip migration
      if (!this.dataComparison.localData) {
        this.migrationService.markMigrationCompleted();
        this.closeDialogEvent.emit();
        return;
      }
      
      // If no server data, auto-migrate local data
      if (!this.dataComparison.hasServerData) {
        await this.chooseLocalData();
        return;
      }
      
    } catch (error) {
      this.loadingError = `Failed to load save data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      this.isLoadingComparison = false;
    }
  }

  async chooseLocalData(): Promise<void> {
    this.isProcessing = true;
    this.processingMessage = 'Uploading your local data to server...';
    this.migrationResult = null;

    try {
      const result = await this.migrationService.migrateUseLocalData();
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
        message: `Failed to upload local data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated: false,
        hadLocalData: true
      };
    } finally {
      this.isProcessing = false;
    }
  }

  async chooseServerData(): Promise<void> {
    this.isProcessing = true;
    this.processingMessage = 'Setting up to use server data...';
    this.migrationResult = null;

    try {
      const result = await this.migrationService.migrateUseServerData();
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
        message: `Failed to configure server data: ${error instanceof Error ? error.message : 'Unknown error'}`,
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