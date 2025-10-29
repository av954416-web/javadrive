import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCarSchema, insertBookingSchema, insertReviewSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Helper to get user ID from request
  const getUserId = (req: any): string => req.user.claims.sub;

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Car routes
  app.get("/api/cars", async (req, res) => {
    try {
      let cars = await storage.getAllCars();

      // Apply filters if provided
      const { search, minPrice, maxPrice, brands, carTypes, transmission } = req.query;

      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        cars = cars.filter(car => 
          car.brand.toLowerCase().includes(searchLower) ||
          car.model.toLowerCase().includes(searchLower)
        );
      }

      if (minPrice && typeof minPrice === 'string') {
        cars = cars.filter(car => Number(car.pricePerDay) >= Number(minPrice));
      }

      if (maxPrice && typeof maxPrice === 'string') {
        cars = cars.filter(car => Number(car.pricePerDay) <= Number(maxPrice));
      }

      if (brands && typeof brands === 'string') {
        const brandList = brands.split(',');
        cars = cars.filter(car => brandList.includes(car.brand));
      }

      if (carTypes && typeof carTypes === 'string') {
        const typeList = carTypes.split(',');
        cars = cars.filter(car => typeList.includes(car.carType));
      }

      if (transmission && typeof transmission === 'string') {
        const transmissionList = transmission.split(',');
        cars = cars.filter(car => transmissionList.includes(car.transmission));
      }

      res.json(cars);
    } catch (error) {
      console.error("Error fetching cars:", error);
      res.status(500).json({ message: "Failed to fetch cars" });
    }
  });

  app.get("/api/cars/:id", async (req, res) => {
    try {
      const car = await storage.getCarById(req.params.id);
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }

      // Get owner details
      const owner = await storage.getUser(car.ownerId);
      
      // Get reviews with user details
      const carReviews = await storage.getReviewsByCarId(car.id);
      const reviewsWithUsers = await Promise.all(
        carReviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return { ...review, user };
        })
      );

      // Get average rating
      const averageRating = await storage.getAverageRating(car.id);

      res.json({
        car,
        owner,
        reviews: reviewsWithUsers,
        averageRating,
      });
    } catch (error) {
      console.error("Error fetching car details:", error);
      res.status(500).json({ message: "Failed to fetch car details" });
    }
  });

  app.post("/api/cars", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only owners can add cars
      if (user?.role !== "owner") {
        return res.status(403).json({ message: "Only owners can add cars" });
      }

      const carData = insertCarSchema.parse({ ...req.body, ownerId: userId });
      const car = await storage.createCar(carData);
      res.json(car);
    } catch (error: any) {
      console.error("Error creating car:", error);
      res.status(400).json({ message: error.message || "Failed to create car" });
    }
  });

  app.put("/api/cars/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const car = await storage.getCarById(req.params.id);
      
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }

      if (car.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedCar = await storage.updateCar(req.params.id, req.body);
      res.json(updatedCar);
    } catch (error: any) {
      console.error("Error updating car:", error);
      res.status(400).json({ message: error.message || "Failed to update car" });
    }
  });

  app.delete("/api/cars/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const car = await storage.getCarById(req.params.id);
      
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }

      if (car.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteCar(req.params.id);
      res.json({ message: "Car deleted successfully" });
    } catch (error) {
      console.error("Error deleting car:", error);
      res.status(500).json({ message: "Failed to delete car" });
    }
  });

  // Booking routes
  app.post("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { carId, startDate, endDate, totalCost } = req.body;

      // Check availability
      const isAvailable = await storage.checkAvailability(
        carId,
        new Date(startDate),
        new Date(endDate)
      );

      if (!isAvailable) {
        return res.status(400).json({ 
          message: "Car is not available for the selected dates" 
        });
      }

      const bookingData = insertBookingSchema.parse({
        carId,
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalCost,
        status: "pending",
        paymentStatus: "pending",
      });

      const booking = await storage.createBooking(bookingData);

      // Create payment record
      await storage.createPayment({
        bookingId: booking.id,
        amount: totalCost,
        currency: "INR",
        status: "pending",
      });

      res.json(booking);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: error.message || "Failed to create booking" });
    }
  });

  // User dashboard routes
  app.get("/api/user/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const userBookings = await storage.getBookingsByUser(userId);

      // Get car and payment details for each booking
      const bookingsWithDetails = await Promise.all(
        userBookings.map(async (booking) => {
          const car = await storage.getCarById(booking.carId);
          const payment = await storage.getPaymentByBookingId(booking.id);
          return { ...booking, car, payment };
        })
      );

      // Calculate stats
      const totalBookings = userBookings.length;
      const upcomingBookings = userBookings.filter(
        b => b.status === "confirmed" && new Date(b.startDate) > new Date()
      ).length;
      const completedBookings = userBookings.filter(
        b => b.status === "completed"
      ).length;

      res.json({
        bookings: bookingsWithDetails,
        stats: {
          totalBookings,
          upcomingBookings,
          completedBookings,
        },
      });
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Owner dashboard routes
  app.get("/api/owner/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      if (user?.role !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const ownerCars = await storage.getCarsByOwner(userId);
      const ownerBookings = await storage.getBookingsByOwner(userId);

      // Get car details for bookings
      const bookingsWithCars = await Promise.all(
        ownerBookings.map(async (booking) => {
          const car = await storage.getCarById(booking.carId);
          return { ...booking, car };
        })
      );

      // Calculate stats
      const totalRevenue = ownerBookings
        .filter(b => b.paymentStatus === "paid")
        .reduce((sum, b) => sum + Number(b.totalCost), 0);

      const activeBookings = ownerBookings.filter(
        b => b.status === "confirmed" || b.status === "pending"
      ).length;

      // Calculate average rating across all cars
      let totalRating = 0;
      let totalReviews = 0;
      for (const car of ownerCars) {
        const reviews = await storage.getReviewsByCarId(car.id);
        totalReviews += reviews.length;
        totalRating += reviews.reduce((sum, r) => sum + r.rating, 0);
      }
      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      res.json({
        cars: ownerCars,
        bookings: bookingsWithCars,
        stats: {
          totalCars: ownerCars.length,
          totalRevenue,
          activeBookings,
          averageRating,
        },
      });
    } catch (error) {
      console.error("Error fetching owner dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Admin dashboard routes
  app.get("/api/admin/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      // This is a simplified version - in production you'd want pagination
      const allCars = await storage.getAllCars();
      const allBookings = await storage.getAllBookings();

      // Get users (simplified - you might want to add a getAllUsers method to storage)
      const allUsers: any[] = [];
      
      // Get car owners for cars list
      const carsWithOwners = await Promise.all(
        allCars.map(async (car) => {
          const owner = await storage.getUser(car.ownerId);
          return { ...car, owner };
        })
      );

      // Get booking details
      const bookingsWithDetails = await Promise.all(
        allBookings.map(async (booking) => {
          const car = await storage.getCarById(booking.carId);
          const bookingUser = await storage.getUser(booking.userId);
          return { ...booking, car, user: bookingUser };
        })
      );

      // Calculate stats
      const totalRevenue = allBookings
        .filter(b => b.paymentStatus === "paid")
        .reduce((sum, b) => sum + Number(b.totalCost), 0);

      res.json({
        users: allUsers,
        cars: carsWithOwners,
        bookings: bookingsWithDetails,
        stats: {
          totalUsers: 0, // Would need a count users method
          totalCars: allCars.length,
          totalBookings: allBookings.length,
          totalRevenue,
        },
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Review routes
  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { carId, rating, comment } = req.body;

      const reviewData = insertReviewSchema.parse({
        carId,
        userId,
        rating,
        comment,
      });

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  app.put("/api/reviews/:id/response", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only owners can respond to reviews
      if (user?.role !== "owner") {
        return res.status(403).json({ message: "Only owners can respond to reviews" });
      }

      const { ownerResponse } = req.body;
      const review = await storage.updateReview(req.params.id, { ownerResponse } as any);
      
      res.json(review);
    } catch (error: any) {
      console.error("Error updating review:", error);
      res.status(400).json({ message: error.message || "Failed to update review" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
