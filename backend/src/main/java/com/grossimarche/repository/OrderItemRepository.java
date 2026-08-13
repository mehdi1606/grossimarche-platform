package com.grossimarche.repository;

import com.grossimarche.dto.dashboard.BestSellerResponse;
import com.grossimarche.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findByOrderId(UUID orderId);

    /** Best-selling products by quantity, from frozen order lines (cancelled orders excluded). */
    @Query("select new com.grossimarche.dto.dashboard.BestSellerResponse("
            + "oi.product.id, oi.productNameSnapshot, sum(oi.quantity), sum(oi.lineTotal)) "
            + "from OrderItem oi "
            + "where oi.order.status <> com.grossimarche.entity.enums.OrderStatus.CANCELLED "
            + "group by oi.product.id, oi.productNameSnapshot "
            + "order by sum(oi.quantity) desc")
    List<BestSellerResponse> bestSellers(Pageable pageable);
}
