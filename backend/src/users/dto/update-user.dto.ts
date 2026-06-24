export class UpdateUserDto {
  fullName?: string;
  email?: string;
  phone?: string | null;
  roleCode?: string;
  branchIds?: string[];
  primaryBranchId?: string | null;
  accessAllBranches?: boolean;
  isActive?: boolean;
}

