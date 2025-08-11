import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 500 })
  content: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  author: string;

  @CreateDateColumn()
  createdAt: Date;
}
