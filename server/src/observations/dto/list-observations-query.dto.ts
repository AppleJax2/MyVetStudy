import { IsOptional, IsUUID, IsInt, Min, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for query parameters when listing observations
 */
export class ListObservationsQueryDto {
  /**
   * Optional filter by symptom template ID
   */
  @IsOptional()
  @IsUUID(4, { message: 'Invalid symptom template ID format' })
  symptomTemplateId?: string;

  /**
   * Optional filter by observation start date
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  /**
   * Optional filter by observation end date
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  /**
   * Maximum number of results to return
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 25;

  /**
   * Page number (1-indexed)
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
}

/**
 * DTO for route parameters when listing observations
 */
export class ListObservationsParamsDto {
  /**
   * ID of the study the observations belong to
   */
  @IsUUID(4, { message: 'Invalid study ID format' })
  studyId: string;

  /**
   * Optional ID of the patient the observations are for
   */
  @IsOptional()
  @IsUUID(4, { message: 'Invalid patient ID format' })
  patientId?: string;
} 