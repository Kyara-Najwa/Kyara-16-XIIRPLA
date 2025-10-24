import About from "./about";
import Projects from "./projects";
import Contact from "./contact";

export default function Home() {
  return (
    <>
      <div id="about">
        <About />
      </div>
      <div id="projects" className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <Projects />
        </div>
      </div>
      <div id="contact" className="relative z-10">
        <Contact />
      </div>
    </>
  );
}
