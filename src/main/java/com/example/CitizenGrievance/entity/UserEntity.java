package com.example.CitizenGrievance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Getter
@Setter
public class UserEntity implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int userId;

    private String role;
    private String aadharNumber;

    private String name;
    private String phoneNumber;
    private String email;
    private String address;
    private String district;
    private String state;
    private String pinCode;
    private String username;
    private String password;

    @OneToMany(cascade = CascadeType.ALL)
    private List<ComplaintMYSQL> complaintMYSQLS =new ArrayList<>();

    public UserEntity() {}

    public UserEntity(String role, String aadharNumber, String name, String phoneNumber, String email, String address, String district, String state, String pinCode, String username, String password) {
        this.role = role;
        this.aadharNumber = aadharNumber;
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.address = address;
        this.district = district;
        this.state = state;
        this.pinCode = pinCode;
        this.username = username;
        this.password = password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role));
    }



}
