import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Phrase structure stored in the theme
 * Each phrase represents a semantic span extracted from responses
 */
export interface ThemePhrase {
  text: string;           // The exact phrase
  class: string;          // Semantic class: user_goal, pain_point, emotion, etc.
}

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

  @Column({ type: 'text', nullable: true })
  phrases!: string | null;  // JSON array of ThemePhrase objects

  @Column({ type: 'integer', default: 0 })
  response_count!: number;  // Cached count of matching responses

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Helper to get parsed phrases
  getPhrases(): ThemePhrase[] {
    if (!this.phrases) return [];
    try {
      return JSON.parse(this.phrases);
    } catch {
      return [];
    }
  }
}
