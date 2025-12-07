import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('response_theme_assignments')
export class ThemeAssignment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  response_id!: number;

  @Column({ type: 'integer' })
  theme_id!: number;

  @Column({ type: 'real' })
  confidence!: number;

  @Column({ type: 'text', nullable: true })
  highlighted_keywords!: string | null; // JSON: [{ text: string, start: number, end: number }]

  @Column({ type: 'text', nullable: true })
  contributing_text!: string | null; // The specific text that matched the theme

  @CreateDateColumn()
  created_at!: Date;
}

