import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import {
  REQUIRE_SUBSCRIPTION_KEY,
  SubscriptionRequirement,
} from '../../common/tenant/decorators/require-subscription.decorator';
import { SubscriptionService } from '../services/subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requirement = this.reflector.getAllAndOverride<SubscriptionRequirement>(
      REQUIRE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user?.schoolId) {
      return true;
    }

    const status = await this.subscriptionService.getSubscriptionStatus(user.schoolId);
    if (!status.canAccessPlatform) {
      throw new ForbiddenException(status.message ?? 'Subscription inactive');
    }

    if (requirement.requireAnalytics && !status.features.analyticsEnabled) {
      throw new ForbiddenException('Analytics not included in current plan');
    }

    if (requirement.checkLimits) {
      await this.subscriptionService.assertWithinLimits(user.schoolId, requirement.checkLimits);
    }

    return true;
  }
}
