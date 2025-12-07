import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryColumn({ type: 'text' })
  session_id!: string;

  @Column({ type: 'text', nullable: true })
  current_question!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

