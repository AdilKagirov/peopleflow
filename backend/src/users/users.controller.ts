import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Headers('x-peopleflow-user-id') actorId?: string) {
    return this.usersService.findAll(actorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-peopleflow-user-id') actorId?: string) {
    return this.usersService.findOne(id, actorId);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Headers('x-peopleflow-user-id') actorId?: string) {
    return this.usersService.create(dto, actorId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Headers('x-peopleflow-user-id') actorId?: string,
  ) {
    return this.usersService.update(id, dto, actorId);
  }
}

