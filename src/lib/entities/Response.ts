import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('responses')
export class ResponseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  session_id!: string;

  @Column({ type: 'text' })
  response_text!: string;

  @Column({ type: 'integer' })
  batch_id!: number;

  @Column({ type: 'text' })
  question!: string;

  @CreateDateColumn()
  created_at!: Date;
}

export { ResponseEntity as Response };


