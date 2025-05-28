"use client";

import { CurrentUserAvatar } from "@/components/auth/current-user-avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Profile } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Edit, Lock } from "lucide-react";
import Link from "next/link";

type AccountInfoProps = {
  profile: Profile | null;
  user: User | null;
  className?: string;
} & React.ComponentPropsWithoutRef<"div">;

export const AccountInfo = ({
  profile,
  user,
  className,
  ...props
}: AccountInfoProps) => {
  const createdAt = profile?.created_at
    ? format(new Date(profile.created_at), "dd MMMM yyyy", { locale: it })
    : "Data non disponibile";

  const lastUpdated = profile?.updated_at
    ? format(new Date(profile.updated_at), "dd MMMM yyyy 'alle' HH:mm", {
        locale: it,
      })
    : "Mai aggiornato";

  return (
    <div className={cn("w-full", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Account</CardTitle>
          <CardDescription>
            Dettagli del tuo account e impostazioni
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <CurrentUserAvatar />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">
                {profile?.full_name ||
                  user?.user_metadata?.full_name ||
                  "Nome non disponibile"}
              </h3>
              <p className="text-muted-foreground text-sm">
                @
                {profile?.user_name ||
                  user?.user_metadata?.user_name ||
                  "username"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm">Email</h4>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm">Account creato</h4>
              <p className="text-muted-foreground text-sm">{createdAt}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm">Ultimo aggiornamento</h4>
              <p className="text-muted-foreground text-sm">{lastUpdated}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Gestione Profilo</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="justify-start w-full"
                asChild
              >
                <Link href="/dashboard/profile/edit">
                  <Edit className="mr-2 w-4 h-4" />
                  Modifica Profilo
                </Link>
              </Button>
              <Button
                variant="outline"
                className="justify-start w-full"
                asChild
              >
                <Link href="/dashboard/profile/change-password">
                  <Lock className="mr-2 w-4 h-4" />
                  Cambia Password
                </Link>
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Azioni Account</h4>
            <div className="space-y-2">
              <LogoutButton variant="outline" className="w-full">
                Logout
              </LogoutButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
