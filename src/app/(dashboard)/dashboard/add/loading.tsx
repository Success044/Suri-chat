import { FC } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const loading: FC = ({}) => {
  return (
    <div className="w-full flex flex-col gap-3">
      {/* to mock the height and width of heading  */}
      <Skeleton className="mb-4" height={60} width={500} />
      {/* to mock below the heading */}
      <Skeleton height={20} width={150} />
      <Skeleton height={50} width={400} />
    </div>
  );
};

export default loading;
