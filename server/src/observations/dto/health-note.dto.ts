import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO for creating a health note observation
 */
export class CreateHealthNoteDto {
  /**
   * Content of the health note
   */
  @IsNotEmpty({ message: 'Health note content is required' })
  @IsString()
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  notes: string;
}

/**
 * DTO for route parameters when creating or listing health notes
 */
export class HealthNoteParamsDto {
  /**
   * ID of the patient the health note is for
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Invalid patient ID format' })
  patientId: string;

  /**
   * ID of the monitoring plan patient record
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Invalid monitoring plan patient ID format' })
  monitoringPlanPatientId: string;
} 