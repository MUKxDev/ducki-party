import type { NextPage } from "next";
import HomePageComponent from "../components/HomePageComponent";
import PageComponent from "../components/PageComponent";

const HomePage: NextPage = () => {
  return (
    <PageComponent title={"Ducki Party"}>
      <HomePageComponent></HomePageComponent>
    </PageComponent>
  );
};

export default HomePage;
