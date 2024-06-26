import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { canAccessMembersTab } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";

import { OrganizationPermissionsGuard } from "../guards/org-permissions.guard";

import { MembersComponent } from "./members.component";

const routes: Routes = [
  {
    path: "",
    component: MembersComponent,
    canActivate: [OrganizationPermissionsGuard],
    data: {
      titleId: "members",
      organizationPermissions: canAccessMembersTab,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MembersRoutingModule {}
