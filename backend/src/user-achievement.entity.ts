import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('user_achievements')
@Index(['user_id', 'achievement_id'], { unique: true })
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_user_achievements_user_id')
  user_id: string; // References users.id from auth service

  @Column({ length: 100 })
  @Index('idx_user_achievements_achievement_id')
  achievement_id: string;

  @Column({ type: 'timestamp' })
  unlocked_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    progress?: number;
    finalValue?: number;
    context?: any;
  };

  @CreateDateColumn()
  created_at: Date;
}