import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle } from "lucide-react";

interface CommunityEulaModalProps {
  open: boolean;
  onAccept: () => void;
}

export const CommunityEulaModal = ({ open, onAccept }: CommunityEulaModalProps) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle className="text-lg">Community Guidelines</DialogTitle>
          </div>
          <DialogDescription>
            Please read and accept our community terms before participating.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4 text-sm text-foreground/90">
            <section>
              <h3 className="font-semibold text-foreground mb-1">1. Zero Tolerance for Objectionable Content</h3>
              <p className="text-muted-foreground">
                The Gemini Community has a <strong>zero-tolerance policy</strong> for objectionable content. This includes, but is not limited to: hate speech, harassment, bullying, threats, sexually explicit material, graphic violence, misinformation, spam, and any content that violates applicable laws.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-1">2. No Abusive Behavior</h3>
              <p className="text-muted-foreground">
                Abusive users will not be tolerated. Any user found engaging in harassment, intimidation, or targeted abuse of other community members will have their content removed and their account permanently suspended.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-1">3. Content Filtering</h3>
              <p className="text-muted-foreground">
                All posts are automatically screened for profanity and objectionable content. Posts flagged by our filters will be held for review and will not be published until approved by an administrator.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-1">4. Reporting & Flagging</h3>
              <p className="text-muted-foreground">
                If you encounter content that violates these guidelines, please use the <strong>"Report"</strong> feature to flag it. You may also <strong>block</strong> abusive users, which will immediately remove their content from your feed and notify our moderation team.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-1">5. Enforcement & Response Time</h3>
              <p className="text-muted-foreground">
                Our moderation team commits to reviewing all flagged content and block reports <strong>within 24 hours</strong>. Upon confirmation of a violation, the offending content will be removed and the responsible user will be ejected from the community.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-1">6. Your Responsibilities</h3>
              <p className="text-muted-foreground">
                By participating in this community, you agree to post only appropriate content, treat others with respect, and report any violations you encounter. Failure to comply with these guidelines may result in permanent removal from the community.
              </p>
            </section>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Important:</strong> Violations of these guidelines will result in content removal within 24 hours and may lead to permanent account suspension.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-2">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="eula-agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label htmlFor="eula-agree" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              I have read, understood, and agree to the Community Guidelines. I understand that violations may result in content removal and account suspension.
            </label>
          </div>
          <Button
            onClick={onAccept}
            disabled={!agreed}
            className="w-full"
          >
            Accept & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
