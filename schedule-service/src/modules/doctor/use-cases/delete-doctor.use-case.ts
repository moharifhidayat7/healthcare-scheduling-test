import { Injectable } from '@nestjs/common';
import { DoctorService } from '../doctor.service';

@Injectable()
export class DeleteDoctorUseCase {
  constructor(private readonly doctorService: DoctorService) {}

  async execute(id: string) {
    return this.doctorService.delete(id);
  }
}
