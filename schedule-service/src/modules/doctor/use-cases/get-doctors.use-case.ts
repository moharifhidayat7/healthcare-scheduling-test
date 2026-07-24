import { Injectable } from '@nestjs/common';
import { DoctorService } from '../doctor.service';

@Injectable()
export class GetDoctorsUseCase {
  constructor(private readonly doctorService: DoctorService) {}

  async execute(page: number = 1, limit: number = 20) {
    return this.doctorService.findAll(page, limit);
  }
}
