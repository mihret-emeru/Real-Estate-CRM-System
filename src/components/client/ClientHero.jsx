"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FiSun, FiSunrise, FiMoon } from "react-icons/fi";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import CustomDropdown from "@/components/common/CustomDropdown";

export default function ClientHero() {
  const { data: session } = useSession();
  const client = session?.user;

  const [greeting, setGreeting] = useState({
    text: "Hello",
    Icon: FiSunrise,
  });

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      setGreeting({ text: "Good morning", Icon: FiSunrise });
    } else if (hour < 17) {
      setGreeting({ text: "Good afternoon", Icon: FiSun });
    } else if (hour < 20) {
      setGreeting({ text: "Good evening", Icon: FiSun });
    } else {
      setGreeting({ text: "Good night", Icon: FiMoon });
    }
  }, []);

  const [propertyType, setPropertyType] = useState("all");
  const [search, setSearch] = useState("");

  function handleSearch(e) {
    e.preventDefault();

    const searchData = {
      city: "Addis Ababa",
      propertyType,
      search,
    };

    console.log("Property search:", searchData);
  }

  return (
    <>
      {/* Greeting above the hero rectangle */}
      <div className="client-welcome">
        <h2 className="client-welcome-greeting">
          <greeting.Icon />
          <span>
            {greeting.text}, {client?.name || "Client"}
          </span>
        </h2>
      </div>

      <section className="client-hero">
        <div className="client-hero-content">
          <span className="client-hero-eyebrow">FIND YOUR NEXT HOME</span>

          <h1>Find a home you'll love.</h1>

          <p>
            Discover properties in Addis Ababa that match your preferences and
            lifestyle.
          </p>
        </div>

        {/* Location */}
        <div className="client-location">
          <FaMapMarkerAlt />

          <span>Addis Ababa</span>
        </div>

        {/* Property Type */}
        <div className="client-type-dropdown">
          <CustomDropdown
            value={propertyType}
            onChange={setPropertyType}
            options={[
              {
                value: "all",
                label: "All Types",
              },

              {
                value: "villa",
                label: "Villa",
              },
              {
                value: "apartment",
                label: "Apartment",
              },
              {
                value: "commercial",
                label: "Commercial",
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}
