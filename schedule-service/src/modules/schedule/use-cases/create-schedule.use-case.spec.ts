import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateScheduleUseCase } from './create-schedule.use-case';
import { CustomerService } from '../../customer/customer.service';
import { DoctorService } from '../../doctor/doctor.service';
import { ScheduleService } from '../schedule.service';
import { MailService } from '../../../common/mail/mail.service';

describe('CreateScheduleUseCase', () => {
  let useCase: CreateScheduleUseCase;
  let customerService: jest.Mocked<CustomerService>;
  let doctorService: jest.Mocked<DoctorService>;
  let scheduleService: jest.Mocked<ScheduleService>;
  let mailService: jest.Mocked<MailService>;

  const mockCustomer = {
    id: 'cust-1',
    name: 'Test',
    email: 'test@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockDoctor = {
    id: 'doc-1',
    name: 'Dr. Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const baseInput = {
    objective: 'Checkup',
    customerId: 'cust-1',
    doctorId: 'doc-1',
    scheduledAt: '2026-08-01T10:00:00.000Z',
  };

  const mockSchedule = {
    id: '1',
    ...baseInput,
    scheduledAt: new Date(baseInput.scheduledAt),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    customerService = {
      findById: jest.fn().mockResolvedValue(mockCustomer),
    } as unknown as jest.Mocked<CustomerService>;

    doctorService = {
      findById: jest.fn().mockResolvedValue(mockDoctor),
    } as unknown as jest.Mocked<DoctorService>;

    scheduleService = {
      validateSchedule: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue(mockSchedule),
    } as unknown as jest.Mocked<ScheduleService>;

    mailService = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<MailService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateScheduleUseCase,
        { provide: CustomerService, useValue: customerService },
        { provide: DoctorService, useValue: doctorService },
        { provide: ScheduleService, useValue: scheduleService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    useCase = module.get(CreateScheduleUseCase);
  });

  it('should create a schedule when valid', async () => {
    const result = await useCase.execute(baseInput);

    expect(customerService.findById).toHaveBeenCalledWith('cust-1');
    expect(doctorService.findById).toHaveBeenCalledWith('doc-1');
    expect(scheduleService.validateSchedule).toHaveBeenCalledWith(
      'doc-1',
      baseInput.scheduledAt,
    );
    expect(scheduleService.create).toHaveBeenCalledWith(baseInput);
    expect(mailService.send).toHaveBeenCalledWith({
      to: mockCustomer.email,
      subject: 'Schedule Confirmed',
      template: 'schedule-created',
      context: {
        customerName: mockCustomer.name,
        doctorName: mockDoctor.name,
        scheduledAt: mockSchedule.scheduledAt.toISOString(),
        objective: mockSchedule.objective,
      },
    });
    expect(result).toEqual(mockSchedule);
  });

  it('should throw NotFoundException when customer does not exist', async () => {
    customerService.findById.mockRejectedValue(
      new NotFoundException(
        `Customer with id ${baseInput.customerId} not found`,
      ),
    );

    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException);
    expect(scheduleService.create).not.toHaveBeenCalled();
    expect(mailService.send).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when doctor does not exist', async () => {
    doctorService.findById.mockRejectedValue(
      new NotFoundException(`Doctor with id ${baseInput.doctorId} not found`),
    );

    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException);
    expect(scheduleService.create).not.toHaveBeenCalled();
    expect(mailService.send).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when schedule overlaps within 15-minute window', async () => {
    scheduleService.validateSchedule.mockRejectedValue(
      new ConflictException(
        `Doctor ${baseInput.doctorId} already has a schedule at ${baseInput.scheduledAt}`,
      ),
    );

    await expect(useCase.execute(baseInput)).rejects.toThrow(ConflictException);
    expect(scheduleService.create).not.toHaveBeenCalled();
    expect(mailService.send).not.toHaveBeenCalled();
  });
});
