import { Module } from '@nestjs/common';
import { PrismaModule } from '../../integrations/prisma/prisma.module';
import { AuthModule } from '../../common/auth/auth.module';
import { CustomerResolver } from './graphql/customer.resolver';
import { CustomerService } from './customer.service';
import { CreateCustomerUseCase } from './use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from './use-cases/update-customer.use-case';
import { GetCustomerUseCase } from './use-cases/get-customer.use-case';
import { GetCustomersUseCase } from './use-cases/get-customers.use-case';
import { DeleteCustomerUseCase } from './use-cases/delete-customer.use-case';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    CustomerResolver,
    CustomerService,
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    GetCustomerUseCase,
    GetCustomersUseCase,
    DeleteCustomerUseCase,
  ],
  exports: [CustomerService],
})
export class CustomerModule {}
