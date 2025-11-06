import MyStudents from "@/components/MyStudents";
import React from "react";

interface IUser {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
}

const getAllUsers = async (): Promise<IUser[]> => {
  const res = await fetch("http://localhost:3000/api/users");
  const data = await res.json();
  return data;
};

const page = async () => {
    const users = await getAllUsers();
  return (
    <div>
      {/*<MyStudents/>*/}
      <p>These are the students:</p>
      {Array.isArray(users) &&
        users.map((user, index) => (
          <div key={index}>
            <p>{user.email}</p>
            <p>
              {user.firstname} {user.lastname}
            </p>
          </div>
        ))}
    </div>
  );
};

export default page;
