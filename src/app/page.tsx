import { Scene01_Hero } from "@/components/scenes/Scene01_Hero";
import { Scene02_Problem } from "@/components/scenes/Scene02_Problem";
import { Scene03_Formulation } from "@/components/scenes/Scene03_Formulation";
import { Scene04_Exact } from "@/components/scenes/Scene04_Exact";
import { Scene05_Genetic } from "@/components/scenes/Scene05_Genetic";
import { Scene06_Convergence } from "@/components/scenes/Scene06_Convergence";
import { Scene07_Comparison } from "@/components/scenes/Scene07_Comparison";
import { Scene08_Robustness } from "@/components/scenes/Scene08_Robustness";
import { Scene09_Conclusions } from "@/components/scenes/Scene09_Conclusions";
import { Scene10_References } from "@/components/scenes/Scene10_References";

export default function Home() {
  return (
    <>
      <Scene01_Hero />
      <Scene02_Problem />
      <Scene03_Formulation />
      <Scene04_Exact />
      <Scene05_Genetic />
      <Scene06_Convergence />
      <Scene07_Comparison />
      <Scene08_Robustness />
      <Scene09_Conclusions />
      <Scene10_References />
    </>
  );
}
