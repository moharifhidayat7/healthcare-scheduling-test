import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ExternalAuthGuard } from '../../../common/auth/external.guard';
import { DoctorType, PaginatedDoctorType } from './types/doctor.type';
import { CreateDoctorInput } from './inputs/create-doctor.input';
import { UpdateDoctorInput } from './inputs/update-doctor.input';
import { CreateDoctorUseCase } from '../use-cases/create-doctor.use-case';
import { UpdateDoctorUseCase } from '../use-cases/update-doctor.use-case';
import { GetDoctorUseCase } from '../use-cases/get-doctor.use-case';
import { GetDoctorsUseCase } from '../use-cases/get-doctors.use-case';
import { DeleteDoctorUseCase } from '../use-cases/delete-doctor.use-case';

@UseGuards(ExternalAuthGuard)
@Resolver(() => DoctorType)
export class DoctorResolver {
  constructor(
    private readonly createDoctorUseCase: CreateDoctorUseCase,
    private readonly updateDoctorUseCase: UpdateDoctorUseCase,
    private readonly getDoctorUseCase: GetDoctorUseCase,
    private readonly getDoctorsUseCase: GetDoctorsUseCase,
    private readonly deleteDoctorUseCase: DeleteDoctorUseCase,
  ) {}

  @Query(() => PaginatedDoctorType, {
    description:
      'Retrieve a paginated list of doctors sorted by creation date descending',
  })
  async doctors(
    @Args('page', {
      type: () => Int,
      nullable: true,
      description: 'Page number (starts at 1)',
    })
    page?: number,
    @Args('limit', {
      type: () => Int,
      nullable: true,
      description: 'Items per page (1-100, default 20)',
    })
    limit?: number,
  ) {
    return this.getDoctorsUseCase.execute(page, limit);
  }

  @Query(() => DoctorType, {
    description: 'Retrieve a single doctor by its unique identifier',
  })
  async doctor(
    @Args('id', {
      type: () => ID,
      description: 'The unique identifier of the doctor',
    })
    id: string,
  ) {
    return this.getDoctorUseCase.execute(id);
  }

  @Mutation(() => DoctorType, {
    description: 'Create a new doctor with the provided name',
  })
  async createDoctor(
    @Args('input', { description: 'Doctor creation payload' })
    input: CreateDoctorInput,
  ) {
    return this.createDoctorUseCase.execute(input);
  }

  @Mutation(() => DoctorType, {
    description:
      'Update an existing doctor by ID. Only provided fields are changed',
  })
  async updateDoctor(
    @Args('input', { description: 'Doctor update payload (id required)' })
    input: UpdateDoctorInput,
  ) {
    return this.updateDoctorUseCase.execute(input);
  }

  @Mutation(() => DoctorType, {
    description: 'Delete a doctor permanently by its unique identifier',
  })
  async deleteDoctor(
    @Args('id', {
      type: () => ID,
      description: 'The unique identifier of the doctor to delete',
    })
    id: string,
  ) {
    return this.deleteDoctorUseCase.execute(id);
  }
}
