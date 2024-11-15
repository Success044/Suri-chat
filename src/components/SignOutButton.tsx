"use client";

import { ButtonHTMLAttributes, FC, useState } from "react";
import Button from "./ui/Button";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { Loader2, LogOut } from "lucide-react";

//Signoutbuttonprops class should have the properties of buttonhtmlattributes has. here singoutbuttonprops dnt have any other properties so, the lint will identify this as no-empty-object-type
// eslint-disable-next-line
interface SignOutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const SignOutButton: FC<SignOutButtonProps> = ({ ...props }) => {
  const [isSignOut, setIsSignOut] = useState<boolean>(false);
  return (
    <Button
      {...props}
      variants="ghost"
      onClick={async () => {
        setIsSignOut(true);
        try {
          await signOut();
        } catch (error) {
          toast.error("There is problem signing out");
          console.log(error);
        } finally {
          setIsSignOut(false);
        }
      }}
    >
      {isSignOut ? (
        <Loader2 className="animate-spin h-4 w-4" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </Button>
  );
};

export default SignOutButton;
