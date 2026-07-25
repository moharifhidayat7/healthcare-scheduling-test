import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteScheduleUseCase } from './delete-schedule.use-case';
import { ScheduleService } from '../schedule.service';
import { CustomerService } from '../../customer/customer.service';
import { DoctorService } from '../../doctor/doctor.service';
import { MailService } from '../../../common/mail/mail.service';

describe('DeleteScheduleUseCase', () => {
  let useCase: DeleteScheduleUseCase;
  let scheduleService: jest.Mocked<ScheduleService>;
  let customerService: jest.Mocked<CustomerService>;
  let doctorService: jest.Mocked<DoctorService>;
  let mailService: jest.Mocked<MailService>;

  const mockSchedule = {
    id: '1',
    objective: 'Checkup',
    customerId: 'cust-1',
    doctorId: 'doc-1',
    scheduledAt: new Date('2026-08-01T10:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomer = {
    id: 'cust-1',
    name: 'Test',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDoctor = {
    id: 'doc-1',
    name: 'Dr. Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    scheduleService = {
      findById: jest.fn().mockResolvedValue(mockSchedule),
      delete: jest.fn().mockResolvedValue(mockSchedule),
    } as unknown as jest.Mocked<ScheduleService>;

    customerService = {
      findById: jest.fn().mockResolvedValue(mockCustomer),
    } as unknown as jest.Mocked<CustomerService>;

    doctorService = {
      findById: jest.fn().mockResolvedValue(mockDoctor),
    } as unknown as jest.Mocked<DoctorService>;

    mailService = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<MailService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteScheduleUseCase,
        { provide: ScheduleService, useValue: scheduleService },
        { provide: CustomerService, useValue: customerService },
        { provide: DoctorService, useValue: doctorService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    useCase = module.get(DeleteScheduleUseCase);
  });

  it('should delete and return the schedule when found', async () => {
    const result = await useCase.execute('1');

    expect(scheduleService.findById).toHaveBeenCalledWith('1');
    expect(customerService.findById).toHaveBeenCalledWith('cust-1');
    expect(doctorService.findById).toHaveBeenCalledWith('doc-1');
    expect(scheduleService.delete).toHaveBeenCalledWith('1');
    expect(mailService.send).toHaveBeenCalledWith({
      to: mockCustomer.email,
      subject: 'Schedule Cancelled',
      template: 'schedule-deleted',
      context: {
        customerName: mockCustomer.name,
        doctorName: mockDoctor.name,
        scheduledAt: mockSchedule.scheduledAt.toISOString(),
        objective: mockSchedule.objective,
      },
    });
    expect(result).toEqual(mockSchedule);
  });

  it('should throw NotFoundException when not found', async () => {
    scheduleService.findById.mockRejectedValue(
      new NotFoundException('Schedule with id 1 not found'),
    );

    await expect(useCase.execute('1')).rejects.toThrow(NotFoundException);
    expect(scheduleService.delete).not.toHaveBeenCalled();
    expect(mailService.send).not.toHaveBeenCalled();
  });
});
