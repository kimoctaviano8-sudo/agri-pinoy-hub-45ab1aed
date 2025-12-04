import { Crown, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role?: string;
  user_roles?: Array<{ role: string }>;
}

interface AdminUsersTabProps {
  users: UserProfile[];
  onToggleUserRole: (userId: string, currentRole: string) => void;
}

export const AdminUsersTab = ({ users, onToggleUserRole }: AdminUsersTabProps) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Users</h2>
        <span className="text-xs text-muted-foreground">
          {users.length} total users
        </span>
      </div>
      
      <div className="space-y-3">
        {users.map((userProfile) => (
          <Card key={userProfile.id} className="p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-medium text-sm leading-tight truncate">
                    {userProfile.full_name || userProfile.email}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{userProfile.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={userProfile.role === 'admin' ? "destructive" : "secondary"} className="text-xs">
                    {userProfile.role === 'admin' ? (
                      <div className="flex items-center space-x-1">
                        <Crown className="w-3 h-3" />
                        <span>Admin</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>User</span>
                      </div>
                    )}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(userProfile.created_at).toLocaleDateString()}
                </span>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant={userProfile.role === 'admin' ? "destructive" : "default"}
                    className="h-7 px-2 text-xs"
                    onClick={() => onToggleUserRole(userProfile.id, userProfile.role || 'user')}
                  >
                    {userProfile.role === 'admin' ? (
                      <>
                        <Crown className="w-3 h-3 mr-1" />
                        Revoke
                      </>
                    ) : (
                      <>
                        <Crown className="w-3 h-3 mr-1" />
                        Grant
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {users.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};