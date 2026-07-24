import { Injectable } from '@nestjs/common';
import { DoctorService } from '../doctor.service';
import { CreateDoctorInput } from '../graphql/inputs/create-doctor.input';

@Injectable()
export class CreateDoctorUseCase {
  constructor(private readonly doctorService: DoctorService) {}

  async execute(input: CreateDoctorInput) {
    return this.doctorService.create(input);
  }
}
