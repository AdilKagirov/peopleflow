export class CreateUserDto {
  fullName!: string;
  email!: string;
  phone?: string;
  roleCode!: string;
  branchIds?: string[];
  primaryBranchId?: string;
  accessAllBranches?: boolean;
  isActive?: boolean;
}

