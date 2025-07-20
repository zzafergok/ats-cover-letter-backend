// src/dto/user.dto.ts
export class UserDto {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: any) {
    this.id = user.id;
    this.email = user.email;
    this.name = `${user.firstName} ${user.lastName}`.trim();
    this.role = user.role;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}

export class CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;

  constructor(data: any) {
    this.email = data.email;
    this.password = data.password;

    const [firstName, ...lastNameParts] = data.name.split(' ');
    this.firstName = firstName;
    this.lastName = lastNameParts.join(' ') || '';
    this.role = data.role || 'USER';
  }
}
