import { IsNotEmpty, IsString, IsOptional, IsUUID, MaxLength, IsAny } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for creating a new observation
 */
export class CreateObservationDto {
  /**
   * ID of the symptom template this observation is based on
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Invalid symptom template ID format' })
  symptomTemplateId: string;

  /**
   * ID of the patient this observation is for
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Invalid patient ID format' })
  patientId: string;

  /**
   * The value of the observation - specific validation happens in service layer based on symptom template
   */
  @IsNotEmpty({ message: 'Observation value is required' })
  value: any;

  /**
   * Optional notes for the observation
   */
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  notes?: string;
}

/**
 * DTO for route parameters when creating an observation
 */
export class CreateObservationParamsDto {
  /**
   * ID of the study this observation belongs to
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Invalid study ID format' })
  studyId: string;
} 