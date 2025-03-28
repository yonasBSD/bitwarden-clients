// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { PolicyType } from "@bitwarden/common/admin-console/enums";
// FIXME: use index.ts imports once policy abstractions and models
// implement ADR-0002
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";

import {
  CredentialAlgorithm as LegacyAlgorithm,
  EmailAlgorithms,
  PasswordAlgorithms,
  UsernameAlgorithms,
} from "..";
import { CredentialAlgorithm } from "../metadata";

/** Reduces policies to a set of available algorithms
 *  @param policies the policies to reduce
 *  @returns the resulting `AlgorithmAvailabilityPolicy`
 */
export function availableAlgorithms(policies: Policy[]): LegacyAlgorithm[] {
  const overridePassword = policies
    .filter((policy) => policy.type === PolicyType.PasswordGenerator && policy.enabled)
    .reduce(
      (type, policy) => (type === "password" ? type : (policy.data.overridePasswordType ?? type)),
      null as LegacyAlgorithm,
    );

  const policy: LegacyAlgorithm[] = [...EmailAlgorithms, ...UsernameAlgorithms];
  if (overridePassword) {
    policy.push(overridePassword);
  } else {
    policy.push(...PasswordAlgorithms);
  }

  return policy;
}

/** Reduces policies to a set of available algorithms
 *  @param policies the policies to reduce
 *  @returns the resulting `AlgorithmAvailabilityPolicy`
 */
export function availableAlgorithms_vNext(policies: Policy[]): CredentialAlgorithm[] {
  const overridePassword = policies
    .filter((policy) => policy.type === PolicyType.PasswordGenerator && policy.enabled)
    .reduce(
      (type, policy) => (type === "password" ? type : (policy.data.overridePasswordType ?? type)),
      null as CredentialAlgorithm,
    );

  const policy: CredentialAlgorithm[] = [...EmailAlgorithms, ...UsernameAlgorithms];
  if (overridePassword) {
    policy.push(overridePassword);
  } else {
    policy.push(...PasswordAlgorithms);
  }

  return policy;
}
