import { Injectable } from '@nestjs/common';
import { DoctorService } from '../doctor.service';
import { UpdateDoctorInput } from '../graphql/inputs/update-doctor.input';

@Injectable()
export class UpdateDoctorUseCase {
  constructor(private readonly doctorService: DoctorService) {}

  async execute(input: UpdateDoctorInput) {
    return this.doctorService.update(input);
  }
}
