import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerService } from '../../customer/customer.service';
import { DoctorService } from '../../doctor/doctor.service';
import { ScheduleService } from '../schedule.service';
import { MailService } from '../../../common/mail/mail.service';
import { CreateScheduleInput } from '../graphql/inputs/create-schedule.input';

@Injectable()
export class CreateScheduleUseCase {
  constructor(
    private readonly customerService: CustomerService,
    private readonly doctorService: DoctorService,
    private readonly scheduleService: ScheduleService,
    private readonly mailService: MailService,
  ) {}

  async execute(input: CreateScheduleInput) {
    const customer = await this.customerService.findById(input.customerId);
    const doctor = await this.doctorService.findById(input.doctorId);

    await this.scheduleService.validateSchedule(
      input.doctorId,
      input.scheduledAt,
    );

    const schedule = await this.scheduleService.create(input);

    await this.mailService.send({
      to: customer.email,
      subject: 'Schedule Confirmed',
      template: 'schedule-created',
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
