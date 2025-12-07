import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('themes')
export class Theme {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  session_id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'real' })
  confidence!: number;

  @Column({ type: 'text', nullable: true })
  centroid_embedding!: string | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

