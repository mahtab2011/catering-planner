// app/plashet-road-food-hub/page.tsx

export const metadata = {
  title:
    "Plashet Road Food Hub London | Authentic Bangladeshi Street Food | SmartServe UK",
  description:
    "Discover Plashet Road Food Hub in East London. Get off at Plashet Road Bus Stop, walk 1 minute to the south side and explore authentic Bangladeshi street food, family-run cafes, pitha, biryani, fuchka and more.",
};


export default function PlashetRoadFoodHubPage() {
  return (
    <main className="min-h-screen bg-orange-50 text-gray-900">
      <section className="px-6 py-16 text-center bg-linear-to-br from-orange-100 to-yellow-50">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Plashet Road Food Hub – East London’s Hidden Food Oasis
        </h1>

        <p className="max-w-3xl mx-auto text-lg md:text-xl">
          Discover authentic Bangladeshi street food, family-run restaurants,
          warm hospitality and a cosy food experience just off Green Street.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">📍 Easy to Find Location</h2>

          <p className="mb-4">
            Getting here is simple. Get off at{" "}
            <strong>Plashet Road Bus Stop</strong>, walk just{" "}
            <strong>1 minute</strong>, and you’ll find the food hub on the{" "}
            <strong>south side of Plashet Road</strong>.
          </p>

          <p>
            While many visitors stop at Green Street, those who walk a little
            further discover a hidden oasis of food, full of flavour, culture
            and community.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow bg-white">
          <iframe
            src="https://www.google.com/maps?q=Plashet+Road+London&output=embed"
            width="100%"
            height="350"
            style={{ border: 0 }}
            loading="lazy"
          ></iframe>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">
            🍛 Authentic Bangladeshi Street Food
          </h2>

          <p className="mb-4">
            Plashet Road is known for its rich variety of Bangladeshi and
            Bengali food. From traditional street snacks to hearty meals, every
            dish is prepared with care by small, family-run businesses.
          </p>

          <ul className="grid md:grid-cols-2 gap-3 list-disc list-inside">
            <li>Pitha — traditional cakes and sweets</li>
            <li>Chotpoti and Fuchka</li>
            <li>Tehari and Polao</li>
            <li>Biryani and meat curries</li>
            <li>Rice, curry and homestyle dishes</li>
            <li>Fresh tea and homemade desserts</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">
            🏡 Family Environment & Friendly Staff
          </h2>

          <p>
            Unlike large commercial restaurants, Plashet Road offers a warm,
            welcoming atmosphere. Friendly staff, small eateries and a strong
            sense of community make it the perfect place to enjoy food at your
            own pace.
          </p>

          <p className="mt-4 font-semibold">
            This is more than just a food street — it is a true oasis of food in
            London.
          </p>
        </div>

        <div className="bg-orange-100 rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">
            🌟 Plashet Road Founding Partners Program
          </h2>

          <p className="mb-4">
            SmartServe UK is inviting selected restaurants and cafés on Plashet
            Road to become founding partners of this flagship food hub.
          </p>

          <ul className="space-y-2 list-disc list-inside mb-4">
            <li>Free lifetime listing for founding partners</li>
            <li>Priority visibility on SmartServe UK</li>
            <li>Promotion as part of Plashet Road Food Hub</li>
            <li>Support for small local entrepreneurs</li>
          </ul>

          <p className="font-bold">
            Future partners after launch: £11.98 per month after six months.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">
            Apply as a Founding Partner
          </h2>

          <form className="grid gap-4">
            <input
              type="text"
              placeholder="Restaurant Name"
              required
              className="border rounded-lg p-3"
            />

            <input
              type="text"
              placeholder="Owner Name"
              required
              className="border rounded-lg p-3"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              required
              className="border rounded-lg p-3"
            />

            <input
              type="text"
              placeholder="Cuisine Type"
              className="border rounded-lg p-3"
            />

            <textarea
              placeholder="Short Description"
              className="border rounded-lg p-3 min-h-28"
            ></textarea>

            <button
              type="submit"
              className="bg-orange-600 text-white font-bold rounded-lg p-3 hover:bg-orange-700"
            >
              Submit Application
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold mb-6">
            Featured Restaurant Listings
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border rounded-xl p-5">
              <h3 className="text-xl font-bold mb-2">Restaurant Name</h3>
              <p>
                <strong>Cuisine:</strong> Bangladeshi Street Food
              </p>
              <p className="my-3">
                Authentic home-style cooking with fresh ingredients and friendly
                service.
              </p>
              <p>
                <strong>Specialties:</strong> Pitha, Fuchka, Tehari
              </p>
              <p>
                <strong>Location:</strong> Plashet Road South Side
              </p>
            </div>

            <div className="border rounded-xl p-5">
              <h3 className="text-xl font-bold mb-2">Café Name</h3>
              <p>
                <strong>Cuisine:</strong> Tea, Cakes & Snacks
              </p>
              <p className="my-3">
                A cosy local café serving tea, sweets, pitha and light bites.
              </p>
              <p>
                <strong>Specialties:</strong> Tea, Pitha, Cakes
              </p>
              <p>
                <strong>Location:</strong> Plashet Road South Side
              </p>
            </div>

            <div className="border rounded-xl p-5">
              <h3 className="text-xl font-bold mb-2">Biryani House</h3>
              <p>
                <strong>Cuisine:</strong> Bangladeshi Meals
              </p>
              <p className="my-3">
                Traditional rice dishes, meat curry, biryani, polao and tehari.
              </p>
              <p>
                <strong>Specialties:</strong> Biryani, Polao, Meat Curry
              </p>
              <p>
                <strong>Location:</strong> Plashet Road South Side
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}