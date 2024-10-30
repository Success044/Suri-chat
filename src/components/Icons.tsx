import { LucideProps, UserPlus } from "lucide-react";
import Suri from "../assets/icons/Suri.png";
import Image from "next/image";

export const Icons = {
  logo: (props: LucideProps) => (
    <Image
      src={Suri}
      width={80}
      height={80}
      style={{ ...props.style }}
      alt="Logo"
    />
  ),
  UserPlus,
};

export type Icon = keyof typeof Icons;
