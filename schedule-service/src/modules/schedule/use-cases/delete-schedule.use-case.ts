import { Injectable } from '@nestjs/common';
import { ScheduleService } from '../schedule.service';
import { CustomerService } from '../../customer/customer.service';
import { DoctorService } from '../../doctor/doctor.service';
import { MailService } from '../../../common/mail/mail.service';

@Injectable()
export class DeleteScheduleUseCase {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly customerService: CustomerService,
    private readonly doctorService: DoctorService,
    private readonly mailService: MailService,
  ) {}

  async execute(id: string) {
    const schedule = await this.scheduleService.findById(id);
    const customer = await this.customerService.findById(schedule.customerId);
    const doctor = await this.doctorService.findById(schedule.doctorId);

    await this.scheduleService.delete(id);

    await this.mailService.send({
      to: customer.email,
      subject: 'Schedule Cancelled',
      template: 'schedule-deleted',
      context: {
        customerName: customer.name,
        doctorName: doctor.name,
        scheduledAt: schedule.scheduledAt.toISOString(),
        objective: schedule.objective,
      },
    });

    return schedule;
  }
}
